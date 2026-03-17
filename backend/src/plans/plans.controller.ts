import { Controller, Get } from '@nestjs/common';
import { PLAN_FEATURES } from './plans.config';

@Controller('plans')
export class PlansController {
  @Get()
  getPlans() {
    return Object.entries(PLAN_FEATURES).map(([key, config]) => ({
      id: key,
      ...config,
    }));
  }
}
