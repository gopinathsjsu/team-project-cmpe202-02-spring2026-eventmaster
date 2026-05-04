from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import Profile

User = get_user_model()


class RoleTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user_role_for_token(user)
        return token


def user_role_for_token(user):
    if user.is_superuser:
        return Profile.Role.ADMIN
    profile = getattr(user, "profile", None)
    return profile.role if profile else Profile.Role.ATTENDEE


class RoleTokenRefreshSerializer(TokenRefreshSerializer):
    """Issue access tokens that include an up-to-date `role` claim after profile changes."""

    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = RefreshToken(attrs["refresh"])
        user = User.objects.get(pk=refresh["user_id"])
        access = refresh.access_token
        access["role"] = user_role_for_token(user)
        data["access"] = str(access)
        return data


class UserMeSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role")

    def get_role(self, obj):
        return user_role_for_token(obj)


class UserMeUpdateSerializer(serializers.ModelSerializer):
    """Writable subset of user + profile fields for PATCH /api/auth/me/."""

    role = serializers.ChoiceField(
        choices=[Profile.Role.ATTENDEE, Profile.Role.ORGANIZER],
        required=False,
        write_only=True,
    )

    class Meta:
        model = User
        fields = ("first_name", "last_name", "email", "role")

    def validate_first_name(self, value):
        return (value or "").strip()

    def validate_last_name(self, value):
        return (value or "").strip()

    def validate_email(self, value):
        normalized = (value or "").strip()
        if not normalized:
            raise serializers.ValidationError("This field may not be blank.")
        user = self.context["request"].user
        if (
            User.objects.exclude(pk=user.pk)
            .filter(email__iexact=normalized)
            .exists()
        ):
            raise serializers.ValidationError("A user with this email already exists.")
        return normalized

    def validate_role(self, value):
        user = self.instance
        if user.is_superuser:
            raise serializers.ValidationError(
                "Superuser accounts cannot change role here."
            )
        profile = getattr(user, "profile", None)
        if profile and profile.role == Profile.Role.ADMIN:
            raise serializers.ValidationError(
                "Administrator role cannot be changed here."
            )
        return value

    def update(self, instance, validated_data):
        new_role = None
        if "role" in validated_data:
            new_role = validated_data.pop("role")

        user = super().update(instance, validated_data)

        if new_role is not None:
            profile = getattr(user, "profile", None)
            if profile is None:
                Profile.objects.create(user=user, role=new_role)
            else:
                profile.role = new_role
                profile.save(update_fields=["role"])

        return user


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, style={"input_type": "password"})
    role = serializers.ChoiceField(
        choices=Profile.Role.choices,
        default=Profile.Role.ATTENDEE,
        write_only=True,
    )

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "first_name", "last_name", "role")
        read_only_fields = ("id",)

    def create(self, validated_data):
        role = validated_data.pop("role", Profile.Role.ATTENDEE)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        Profile.objects.filter(user=user).update(role=role)
        return user
