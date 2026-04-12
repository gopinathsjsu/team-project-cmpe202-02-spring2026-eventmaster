from rest_framework import permissions

from accounts.models import Profile


def user_role(user):
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return Profile.Role.ADMIN
    profile = getattr(user, "profile", None)
    return profile.role if profile else None


class IsRoleAdmin(permissions.BasePermission):
    """App admin or Django superuser."""

    def has_permission(self, request, view):
        return user_role(request.user) == Profile.Role.ADMIN


class IsOrganizerOrAdmin(permissions.BasePermission):
    """Organizer, app admin, or Django superuser."""

    def has_permission(self, request, view):
        role = user_role(request.user)
        return role in (Profile.Role.ORGANIZER, Profile.Role.ADMIN)
