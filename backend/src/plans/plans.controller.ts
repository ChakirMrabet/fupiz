import { Controller, Get } from '@nestjs/common';
import { PLAN_FEATURES, PLAN_IDS } from './plans.config';

@Controller('plans')
export class PlansController {
  @Get()
  getPlans() {
    return PLAN_IDS.map((id) => ({
      id,
      ...PLAN_FEATURES[id],
    }));
  }
}
