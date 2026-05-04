from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Category(models.Model):
    slug = models.SlugField(unique=True, max_length=48)
    name = models.CharField(max_length=80)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name


class Event(models.Model):
    """Event listings with discovery, venue, ticketing hints, and moderation-friendly status."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PENDING_APPROVAL = "pending_approval", "Pending approval"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"

    class VenueType(models.TextChoices):
        IN_PERSON = "in_person", "In person"
        ONLINE = "online", "Online"
        HYBRID = "hybrid", "Hybrid"

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="events",
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, default="")
    location = models.CharField(
        max_length=200,
        blank=True,
        default="",
        db_index=True,
        help_text="Venue address or city for in-person / hybrid events.",
    )
    venue_type = models.CharField(
        max_length=20,
        choices=VenueType.choices,
        default=VenueType.IN_PERSON,
        db_index=True,
    )
    online_url = models.URLField(blank=True, default="")
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        help_text="Optional map pin (WGS84).",
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
    )
    cover_image = models.URLField(blank=True, default="")
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum attendees; null means no limit set.",
    )
    is_free = models.BooleanField(default=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    currency = models.CharField(max_length=3, default="USD")
    schedule_items = models.JSONField(
        default=list,
        blank=True,
        help_text='Optional agenda: [{"title","starts_at","ends_at"}] ISO datetimes.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["status", "starts_at"]),
            models.Index(fields=["category", "starts_at"]),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        if self.ends_at and self.starts_at and self.ends_at <= self.starts_at:
            raise ValidationError({"ends_at": "End time must be after start time."})


class EventRsvp(models.Model):
    """Attendee registration for a published event (capacity enforced in application logic)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_rsvps",
    )
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="rsvps",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "event"],
                name="events_eventrsvp_unique_user_event",
            ),
        ]

    def __str__(self):
        return f"{self.user_id} → {self.event_id}"
