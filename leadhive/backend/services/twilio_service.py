from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from config import settings
import logging

logger = logging.getLogger(__name__)

class TwilioService:
    def __init__(self):
        self.client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        self.from_number = settings.TWILIO_PHONE_NUMBER

    async def send_sms(self, to_number: str, body: str):
        """
        Sends an SMS message using Twilio.
        Note: The standard Twilio Python library is synchronous. 
        For a production app with high volume, we'd use the async client or httpx.
        """
        try:
            # Twilio's standard client is blocking. 
            # In a real async app, we'd use the AsyncClient if available or run in thread.
            message = self.client.messages.create(
                body=body,
                from_=self.from_number,
                to=to_number
            )
            return message.sid
        except TwilioRestException as e:
            logger.error(f"Error sending SMS via Twilio: {e}")
            raise e

twilio_service = TwilioService()
