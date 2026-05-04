from django.utils.dateparse import parse_datetime
from rest_framework import serializers

from events.models import Category, Event


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "slug", "name")


class EventReadSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    organizer_id = serializers.IntegerField(source="organizer.id", read_only=True)
    organizer_username = serializers.CharField(source="organizer.username", read_only=True)

    class Meta:
        model = Event
        fields = (
            "id",
            "organizer_id",
            "organizer_username",
            "category",
            "title",
            "description",
            "location",
            "venue_type",
            "online_url",
            "latitude",
            "longitude",
            "cover_image",
            "starts_at",
            "ends_at",
            "status",
            "capacity",
            "is_free",
            "price",
            "currency",
            "schedule_items",
            "created_at",
            "updated_at",
        )


class EventDetailSerializer(EventReadSerializer):
    rsvp_count = serializers.SerializerMethodField()
    user_has_rsvp = serializers.SerializerMethodField()
    spots_remaining = serializers.SerializerMethodField()

    class Meta(EventReadSerializer.Meta):
        fields = EventReadSerializer.Meta.fields + (
            "rsvp_count",
            "user_has_rsvp",
            "spots_remaining",
        )

    def get_rsvp_count(self, obj):
        return obj.rsvps.count()

    def get_user_has_rsvp(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.rsvps.filter(user_id=request.user.id).exists()

    def get_spots_remaining(self, obj):
        n = self.get_rsvp_count(obj)
        cap = obj.capacity
        if cap is None:
            return None
        return max(0, int(cap) - n)


class EventCreateSerializer(serializers.ModelSerializer):
    """Create events (organizers/admins). Validates venue rules, pricing, and optional agenda."""

    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=True,
        allow_null=False,
    )
    schedule_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )

    class Meta:
        model = Event
        fields = (
            "title",
            "description",
            "category",
            "venue_type",
            "location",
            "online_url",
            "latitude",
            "longitude",
            "cover_image",
            "starts_at",
            "ends_at",
            "status",
            "capacity",
            "is_free",
            "price",
            "currency",
            "schedule_items",
        )

    def validate_title(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Title may not be blank.")
        return value

    def validate_capacity(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value

    def validate_schedule_items(self, value):
        cleaned = []
        for idx, row in enumerate(value or []):
            if not isinstance(row, dict):
                raise serializers.ValidationError(f"Item {idx + 1} must be an object.")
            title = (row.get("title") or "").strip()
            if not title:
                raise serializers.ValidationError(f"Item {idx + 1} requires a title.")
            starts_raw = row.get("starts_at")
            ends_raw = row.get("ends_at")
            if not starts_raw or not ends_raw:
                raise serializers.ValidationError(
                    f"Item {idx + 1} requires starts_at and ends_at (ISO 8601)."
                )
            starts = (
                parse_datetime(starts_raw)
                if isinstance(starts_raw, str)
                else starts_raw
            )
            ends = parse_datetime(ends_raw) if isinstance(ends_raw, str) else ends_raw
            if not starts or not ends:
                raise serializers.ValidationError(f"Item {idx + 1} has invalid datetimes.")
            if ends <= starts:
                raise serializers.ValidationError(
                    f"Item {idx + 1}: end must be after start."
                )
            cleaned.append(
                {
                    "title": title,
                    "starts_at": starts_raw if isinstance(starts_raw, str) else starts.isoformat(),
                    "ends_at": ends_raw if isinstance(ends_raw, str) else ends.isoformat(),
                }
            )
        return cleaned

    def validate(self, attrs):
        venue_type = attrs.get("venue_type", Event.VenueType.IN_PERSON)
        location = (attrs.get("location") or "").strip()
        online_url = (attrs.get("online_url") or "").strip()

        if venue_type == Event.VenueType.IN_PERSON and not location:
            raise serializers.ValidationError(
                {"location": "Location is required for in-person events."}
            )
        if venue_type == Event.VenueType.ONLINE and not online_url:
            raise serializers.ValidationError(
                {"online_url": "Meeting or stream URL is required for online events."}
            )
        if venue_type == Event.VenueType.HYBRID:
            if not location:
                raise serializers.ValidationError(
                    {"location": "Location is required for hybrid events."}
                )
            if not online_url:
                raise serializers.ValidationError(
                    {"online_url": "Online URL is required for hybrid events."}
                )

        is_free = attrs.get("is_free", True)
        price = attrs.get("price")
        if not is_free:
            if price is None:
                raise serializers.ValidationError(
                    {"price": "Price is required when the event is not free."}
                )
            if price <= 0:
                raise serializers.ValidationError(
                    {"price": "Price must be greater than zero for paid events."}
                )
        else:
            attrs["price"] = None

        lat = attrs.get("latitude")
        lng = attrs.get("longitude")
        if (lat is None) ^ (lng is None):
            raise serializers.ValidationError(
                "Provide both latitude and longitude for a map pin, or leave both empty."
            )

        starts_at = attrs.get("starts_at")
        ends_at = attrs.get("ends_at")
        if starts_at and ends_at and ends_at <= starts_at:
            raise serializers.ValidationError(
                {"ends_at": "End time must be after start time."}
            )

        return attrs

    def create(self, validated_data):
        validated_data["organizer"] = self.context["request"].user
        return super().create(validated_data)
