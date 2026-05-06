from django.urls import path

from events.views import (
    AdminPendingEventListView,
    CategoryListView,
    EventApproveView,
    EventListCreateView,
    EventManageView,
    EventRejectView,
    EventRegistrationDestroyView,
    EventRegistrationListView,
    EventRetrieveView,
    EventRsvpView,
    EventUpcomingListView,
    MyRsvpEventListView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="event-categories-list"),
    path("my-rsvps/", MyRsvpEventListView.as_view(), name="event-my-rsvps"),
    path("upcoming/", EventUpcomingListView.as_view(), name="event-upcoming-list"),
    path(
        "admin/pending/",
        AdminPendingEventListView.as_view(),
        name="admin-events-pending",
    ),
    path("<int:pk>/registrations/", EventRegistrationListView.as_view(), name="event-registrations"),
    path(
        "<int:pk>/registrations/<int:user_id>/",
        EventRegistrationDestroyView.as_view(),
        name="event-registration-destroy",
    ),
    path("<int:pk>/rsvp/", EventRsvpView.as_view(), name="event-rsvp"),
    path("<int:pk>/manage/", EventManageView.as_view(), name="event-manage"),
    path("<int:pk>/approve/", EventApproveView.as_view(), name="event-approve"),
    path("<int:pk>/reject/", EventRejectView.as_view(), name="event-reject"),
    path("<int:pk>/", EventRetrieveView.as_view(), name="event-detail"),
    path("", EventListCreateView.as_view(), name="event-list-create"),
]
