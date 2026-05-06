from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import Profile
from events.models import Category, Event, EventRsvp


User = get_user_model()


@dataclass(frozen=True)
class SeedUserSpec:
    username: str
    email: str
    role: str
    password: str
    is_staff: bool = False
    is_superuser: bool = False


class Command(BaseCommand):
    help = "Create/update local development seed data (users, categories, events, rsvps)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--password",
            default="password123",
            help="Password to set for newly-created users (default: password123).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        password = options["password"]

        users = self._seed_users(password=password)
        categories = self._seed_categories()
        events = self._seed_events(users=users, categories=categories)
        self._seed_rsvps(users=users, events=events)

        self.stdout.write(self.style.SUCCESS("Seed data ensured."))

    def _seed_users(self, password: str) -> dict[str, User]:
        specs: list[SeedUserSpec] = [
            SeedUserSpec(
                username="admin",
                email="admin@example.com",
                role=Profile.Role.ADMIN,
                password=password,
                is_staff=True,
                is_superuser=True,
            ),
            SeedUserSpec(
                username="organizer1",
                email="organizer1@example.com",
                role=Profile.Role.ORGANIZER,
                password=password,
                is_staff=True,
            ),
            SeedUserSpec(
                username="organizer2",
                email="organizer2@example.com",
                role=Profile.Role.ORGANIZER,
                password=password,
                is_staff=True,
            ),
            SeedUserSpec(
                username="user1",
                email="user1@example.com",
                role=Profile.Role.ATTENDEE,
                password=password,
            ),
            SeedUserSpec(
                username="user2",
                email="user2@example.com",
                role=Profile.Role.ATTENDEE,
                password=password,
            ),
        ]

        out: dict[str, User] = {}
        for spec in specs:
            user, created = User.objects.get_or_create(
                username=spec.username,
                defaults={
                    "email": spec.email,
                    "is_staff": spec.is_staff,
                    "is_superuser": spec.is_superuser,
                },
            )
            changed = False

            if created:
                user.set_password(spec.password)
                changed = True

            if user.email != spec.email:
                user.email = spec.email
                changed = True

            if user.is_staff != spec.is_staff:
                user.is_staff = spec.is_staff
                changed = True

            if user.is_superuser != spec.is_superuser:
                user.is_superuser = spec.is_superuser
                changed = True

            if changed:
                user.save()

            # Ensure profile role matches spec; signals create default profile on user create.
            profile, _ = Profile.objects.get_or_create(user=user)
            if profile.role != spec.role:
                profile.role = spec.role
                profile.save(update_fields=["role"])

            out[spec.username] = user

        return out

    def _seed_categories(self) -> dict[str, Category]:
        specs = [
            ("tech", "Tech"),
            ("music", "Music"),
            ("sports", "Sports"),
            ("food", "Food & Drink"),
        ]
        out: dict[str, Category] = {}
        for slug, name in specs:
            cat, _ = Category.objects.get_or_create(slug=slug, defaults={"name": name})
            if cat.name != name:
                cat.name = name
                cat.save(update_fields=["name"])
            out[slug] = cat
        return out

    def _seed_events(
        self,
        *,
        users: dict[str, User],
        categories: dict[str, Category],
    ) -> dict[str, Event]:
        now = timezone.now()

        # Deterministic-ish keys so repeated runs update same events.
        specs = [
            {
                "key": "react-night",
                "organizer": users["organizer1"],
                "category": categories["tech"],
                "title": "React Night: Building with Next.js",
                "description": "An intro-to-intermediate meetup on building modern UIs with Next.js.",
                "venue_type": Event.VenueType.IN_PERSON,
                "location": "San Jose, CA",
                "starts_at": now + timedelta(days=3, hours=1),
                "ends_at": now + timedelta(days=3, hours=3),
                "status": Event.Status.PUBLISHED,
                "capacity": 120,
                "is_free": True,
                "price": None,
                "currency": "USD",
                "online_url": "",
            },
            {
                "key": "lofi-online",
                "organizer": users["organizer1"],
                "category": categories["music"],
                "title": "Lo-fi Listening Party (Online)",
                "description": "A chill online listening party with community playlist submissions.",
                "venue_type": Event.VenueType.ONLINE,
                "location": "",
                "starts_at": now + timedelta(days=5, hours=2),
                "ends_at": now + timedelta(days=5, hours=4),
                "status": Event.Status.PUBLISHED,
                "capacity": None,
                "is_free": True,
                "price": None,
                "currency": "USD",
                "online_url": "https://example.com/stream",
            },
            {
                "key": "tacos-hybrid",
                "organizer": users["organizer2"],
                "category": categories["food"],
                "title": "Tacos & Talks (Hybrid)",
                "description": "Lightning talks + taco bar. Join in-person or watch online.",
                "venue_type": Event.VenueType.HYBRID,
                "location": "Santa Clara, CA",
                "starts_at": now + timedelta(days=7, hours=0),
                "ends_at": now + timedelta(days=7, hours=2),
                "status": Event.Status.PUBLISHED,
                "capacity": 60,
                "is_free": False,
                "price": "10.00",
                "currency": "USD",
                "online_url": "https://example.com/hybrid",
            },
        ]

        out: dict[str, Event] = {}
        for spec in specs:
            event, _ = Event.objects.get_or_create(
                organizer=spec["organizer"],
                title=spec["title"],
                starts_at=spec["starts_at"],
                defaults={
                    "category": spec["category"],
                    "description": spec["description"],
                    "location": spec["location"],
                    "venue_type": spec["venue_type"],
                    "online_url": spec["online_url"],
                    "ends_at": spec["ends_at"],
                    "status": spec["status"],
                    "capacity": spec["capacity"],
                    "is_free": spec["is_free"],
                    "price": spec["price"],
                    "currency": spec["currency"],
                },
            )

            # Update mutable fields to keep seeds consistent across restarts.
            changed_fields: list[str] = []
            for field in [
                "category",
                "description",
                "location",
                "venue_type",
                "online_url",
                "ends_at",
                "status",
                "capacity",
                "is_free",
                "price",
                "currency",
            ]:
                if getattr(event, field) != spec[field]:
                    setattr(event, field, spec[field])
                    changed_fields.append(field)
            if changed_fields:
                event.save(update_fields=changed_fields)

            out[spec["key"]] = event

        return out

    def _seed_rsvps(self, *, users: dict[str, User], events: dict[str, Event]) -> None:
        attendee_users = [users["user1"], users["user2"]]
        target_events = [events["react-night"], events["lofi-online"], events["tacos-hybrid"]]

        for u in attendee_users:
            for e in target_events[:2]:
                EventRsvp.objects.get_or_create(user=u, event=e)

