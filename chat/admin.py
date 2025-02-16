from django.contrib import admin
from .models import Chat


class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'participants_list')

    def participants_list(self, obj):
        return ", ".join([user.email for user in obj.participants.all()])
    participants_list.short_description = 'Participants'


admin.site.register(Chat, ChatAdmin)
