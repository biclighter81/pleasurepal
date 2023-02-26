import { Test, TestingModule } from '@nestjs/testing';
import { MembershipController } from './membership.controller';

describe('MembershipController', () => {
  let controller: MembershipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipController],
    }).compile();

    controller = module.get<MembershipController>(MembershipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
