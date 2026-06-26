import os
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException


class TwilioService:
    """Wrapper around the Twilio REST API for SMS and voice operations."""

    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.client = Client(self.account_sid, self.auth_token) if self.account_sid and self.auth_token else None

    def is_configured(self) -> bool:
        return all([self.account_sid, self.auth_token, self.phone_number, self.client])

    def send_sms(self, to: str, body: str) -> dict:
        """Send an outbound SMS message."""
        if not self.is_configured():
            raise RuntimeError("Twilio is not configured")
        try:
            message = self.client.messages.create(
                to=to,
                from_=self.phone_number,
                body=body,
            )
            return {"sid": message.sid, "status": message.status, "to": to, "body": body}
        except TwilioRestException as e:
            raise RuntimeError(f"Twilio error: {e}")

    def get_call_context(self, call_sid: str) -> dict:
        """Fetch call details for a given CallSid."""
        if not self.is_configured():
            raise RuntimeError("Twilio is not configured")
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "sid": call.sid,
                "from": call.from_,
                "to": call.to,
                "status": call.status,
                "direction": call.direction,
                "duration": call.duration,
            }
        except TwilioRestException as e:
            raise RuntimeError(f"Twilio error: {e}")