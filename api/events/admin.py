from django.contrib import admin

from events.models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "organizer", "status", "starts_at", "location")
    list_filter = ("status",)
    search_fields = ("title", "description", "location")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "starts_at"
