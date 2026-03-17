import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { LinksService } from './links/links.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: LinksService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('controller', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });
});
