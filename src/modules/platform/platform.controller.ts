import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PlatformService } from './platform.service';
import { PlatformLoginDto } from './dto/platform-login.dto';
import { AuthGuard, PlatformGuard } from '../auth/auth.guard';
import { CreateRestaurantDto, CreateRestaurantLocationDto } from './dto/create-restaurant.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Post('auth/login')
  login(@Body() body: PlatformLoginDto) {
    return this.platform.login(body.username, body.password);
  }

  @Get('restaurants')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  restaurants() {
    return this.platform.listRestaurants();
  }

  @Post('restaurants')
  createRestaurant(@Body() body: CreateRestaurantDto) {
    return this.platform.createRestaurant(body);
  }

  @Get('restaurants/:tenantId')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  getRestaurant(@Param('tenantId') tenantId: string) {
    return this.platform.getRestaurant(tenantId);
  }

  @Patch('restaurants/:tenantId')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  patchRestaurant(
    @Param('tenantId') tenantId: string,
    @Body() body: UpdateBusinessDto,
  ) {
    return this.platform.updateRestaurant(tenantId, body);
  }

  @Post('restaurants/:tenantId/locations')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  createLocation(
    @Param('tenantId') tenantId: string,
    @Body() body: CreateRestaurantLocationDto,
  ) {
    return this.platform.createRestaurantLocation(tenantId, body);
  }

  @Get('restaurants/:tenantId/locations')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  listLocations(@Param('tenantId') tenantId: string) {
    return this.platform.listRestaurantLocations(tenantId);
  }

  @Post('restaurants/:tenantId/stripe/connect-account')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  createConnectAccount(@Param('tenantId') tenantId: string) {
    return this.platform.createConnectAccount(tenantId);
  }

  @Get('restaurants/:tenantId/stripe/connect-status')
  @UseGuards(AuthGuard, PlatformGuard())
  @ApiBearerAuth('bearer')
  connectStatus(@Param('tenantId') tenantId: string) {
    return this.platform.connectStatus(tenantId);
  }
}
