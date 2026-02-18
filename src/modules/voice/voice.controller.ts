import { Body, Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  @Post('tts')
  @ApiBody({ schema: { example: { text: 'Your order will be ready shortly.' } } })
  async tts(@Body() body: { text: string }) {
    // Placeholder stub; ElevenLabs integration will be wired next.
    throw new ServiceUnavailableException('elevenlabs_not_configured');
  }
}
