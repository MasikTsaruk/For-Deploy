from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_welcome_email(user_email, user_first_name):
    subject = 'Thank you for registration!'
    message = f'Hi {user_first_name},\n\nThank you for registering at my site.\n\nMaksym Tsaruk\nPortfolio Project'
    email_from = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user_email]

    send_mail(subject, message, email_from, recipient_list)
