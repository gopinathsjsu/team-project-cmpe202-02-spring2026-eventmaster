from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Event(models.Model):
    """Stored events; list/filter fields align with typical search (text, date, status, location)."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        PUBLISHED = "published", "Published"
        CANCELLED = "cancelled", "Cancelled"

    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="organized_events",
    )
    title = models.CharField(max_length=200, db_index=True)
    description = models.TextField(blank=True, default="")
    location = models.CharField(
        max_length=200,
        blank=True,
        default="",
        db_index=True,
        help_text="City, venue name, or address string for filtering/search.",
    )
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["starts_at"]
        indexes = [
            models.Index(fields=["status", "starts_at"]),
        ]

    def __str__(self):
        return self.title

    def clean(self):
        super().clean()
        if self.ends_at and self.starts_at and self.ends_at <= self.starts_at:
            raise ValidationError({"ends_at": "End time must be after start time."})
