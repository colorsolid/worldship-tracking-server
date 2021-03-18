import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.core import serializers
from tracking.models import Shipment, Package

from .utils import rand


class InfoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add(
            'main',
            self.channel_name
        )
        await self.accept()

        self.connection_id = rand()
        await self.send(json.dumps({
            'id': self.connection_id
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'main',
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        # Send message to room group
        await handle_data(data)
        await self.channel_layer.group_send(
            'main',
            {
                'type': 'send',
                'data': {'alert': 'refresh'}
            }
        )
