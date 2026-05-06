from django.db import IntegrityError
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsOrganizerOrAdmin, IsRoleAdmin
from accounts.permissions import user_role
from accounts.models import Profile
from events.models import Category, Event, EventRsvp
from events.serializers import (
    CategorySerializer,
    EventCreateSerializer,
    EventDetailSerializer,
    EventReadSerializer,
    EventRegistrationSerializer,
    EventUpdateSerializer,
)


class EventRetrieveView(generics.RetrieveAPIView):
    """Single event: published (anyone) or draft owned by the authenticated organizer."""

    permission_classes = [permissions.AllowAny]
    serializer_class = EventDetailSerializer
    queryset = (
        Event.objects.select_related("category", "organizer")
        .prefetch_related("rsvps")
        .all()
    )

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if obj.status == Event.Status.PUBLISHED:
            return obj
        if user.is_authenticated and obj.organizer_id == user.id:
            return obj
        raise Http404()


class EventRsvpView(APIView):
    """Register or unregister the authenticated user for a published event."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        event = get_object_or_404(
            Event.objects.select_related("category", "organizer").prefetch_related("rsvps"),
            pk=pk,
        )
        if event.status != Event.Status.PUBLISHED:
            return Response(
                {"detail": "Registration is only available for published events."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if event.organizer_id == request.user.id:
            return Response(
                {"detail": "Organizers manage attendance from Manage attendees instead of registering."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        count = event.rsvps.count()
        if event.capacity is not None and count >= event.capacity:
            return Response(
                {"detail": "This event is at capacity."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            EventRsvp.objects.create(user=request.user, event=event)
        except IntegrityError:
            return Response(
                {"detail": "You are already registered for this event."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.refresh_from_db()
        data = EventDetailSerializer(event, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        deleted, _ = EventRsvp.objects.filter(user=request.user, event=event).delete()
        if deleted == 0:
            return Response(
                {"detail": "No registration found for this event."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventRegistrationListView(generics.ListAPIView):
    """List users registered for an event (organizer owner or admin)."""

    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]
    serializer_class = EventRegistrationSerializer

    def get_queryset(self):
        event = get_object_or_404(Event.objects.select_related("organizer"), pk=self.kwargs["pk"])
        role = user_role(self.request.user)
        if role != Profile.Role.ADMIN and event.organizer_id != self.request.user.id:
            raise Http404()
        return (
            EventRsvp.objects.filter(event=event)
            .select_related("user")
            .order_by("created_at")
        )


class EventRegistrationDestroyView(APIView):
    """Remove a user's registration for an event (organizer owner or admin)."""

    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def delete(self, request, pk, user_id):
        event = get_object_or_404(Event.objects.select_related("organizer"), pk=pk)
        role = user_role(request.user)
        if role != Profile.Role.ADMIN and event.organizer_id != request.user.id:
            raise Http404()
        deleted, _ = EventRsvp.objects.filter(event=event, user_id=user_id).delete()
        if deleted == 0:
            return Response(
                {"detail": "No registration found for this user."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyRsvpEventListView(generics.ListAPIView):
    """Events the current user has registered for (calendar / attendee view)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EventReadSerializer

    def get_queryset(self):
        return (
            Event.objects.filter(rsvps__user=self.request.user)
            .select_related("category", "organizer")
            .distinct()
            .order_by("starts_at")
        )


class CategoryListView(generics.ListAPIView):
    """Public list of categories for event discovery and create-event form."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class AdminPendingEventListView(generics.ListAPIView):
    """Events awaiting moderator approval (admin app role or Django superuser)."""

    serializer_class = EventReadSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]

    def get_queryset(self):
        return (
            Event.objects.filter(status=Event.Status.PENDING_APPROVAL)
            .select_related("category", "organizer")
            .order_by("created_at")
        )


class EventApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]

    def post(self, request, pk):
        event = get_object_or_404(
            Event.objects.select_related("category", "organizer"),
            pk=pk,
        )
        if event.status != Event.Status.PENDING_APPROVAL:
            return Response(
                {"detail": "This event is not awaiting approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.status = Event.Status.PUBLISHED
        event.save(update_fields=["status"])
        return Response(
            EventReadSerializer(event, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class EventRejectView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRoleAdmin]

    def post(self, request, pk):
        event = get_object_or_404(
            Event.objects.select_related("category", "organizer"),
            pk=pk,
        )
        if event.status != Event.Status.PENDING_APPROVAL:
            return Response(
                {"detail": "This event is not awaiting approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        event.status = Event.Status.DRAFT
        event.save(update_fields=["status"])
        return Response(
            EventReadSerializer(event, context={"request": request}).data,
            status=status.HTTP_200_OK,
        )


class EventUpcomingListView(generics.ListAPIView):
    """Published events with a future start time — for dashboard discovery (JSON)."""

    serializer_class = EventReadSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Event.objects.filter(
                status=Event.Status.PUBLISHED,
                starts_at__gte=timezone.now(),
            )
            .select_related("category", "organizer")
            .order_by("starts_at")[:24]
        )


class EventListCreateView(generics.ListCreateAPIView):
    """Organizers create events; list returns the current user's events."""

    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]

    def get_queryset(self):
        return (
            Event.objects.filter(organizer=self.request.user)
            .select_related("category", "organizer")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return EventCreateSerializer
        return EventReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        read = EventReadSerializer(event, context={"request": request})
        return Response(read.data, status=201)


class EventManageView(generics.RetrieveUpdateDestroyAPIView):
    """Manage a single event (organizer owner or admin)."""

    permission_classes = [permissions.IsAuthenticated, IsOrganizerOrAdmin]
    queryset = Event.objects.select_related("category", "organizer").prefetch_related("rsvps")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return EventUpdateSerializer
        return EventDetailSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = user_role(self.request.user)
        if role == Profile.Role.ADMIN:
            return qs
        return qs.filter(organizer=self.request.user)

    def perform_update(self, serializer):
        event = serializer.save()
        return event
