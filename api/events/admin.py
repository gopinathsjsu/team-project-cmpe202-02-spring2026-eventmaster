from django.contrib import admin

from events.models import Category, Event, EventRsvp


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")


@admin.register(EventRsvp)
class EventRsvpAdmin(admin.ModelAdmin):
    list_display = ("user", "event", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user__username", "event__title")
    autocomplete_fields = ("user", "event")
    date_hierarchy = "created_at"


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "organizer", "category", "venue_type", "status", "starts_at", "location")
    list_filter = ("status", "venue_type", "category")
    search_fields = ("title", "description", "location")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "starts_at"
