import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
  @Post('tts')
  async tts(@Body() body: { text: string }) {
    // Placeholder stub; ElevenLabs integration will be wired next.
    return { error: 'elevenlabs_error', message: 'Not configured' };
  }
}
