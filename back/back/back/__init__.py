from __future__ import absolute_import, unicode_literals

# Это позволит импортировать Celery, когда Django будет загружаться
from back.celery import app as celery_app

__all__ = ('celery_app',)
