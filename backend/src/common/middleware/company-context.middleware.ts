import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserCompanyService } from '../../user-company/user-company.service';

@Injectable()
export class CompanyContextMiddleware implements NestMiddleware {
  constructor(private readonly userCompanyService: UserCompanyService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    if (req.user && req.user.id) {
      // Get companyId from header or session
      const companyId =
        (req.headers['x-company-id'] as string) || req.user.activeCompany;

      if (companyId) {
        const membership = await this.userCompanyService.getMembership(
          req.user.id,
          companyId,
        );
        if (membership) {
          req.companyId = companyId;
          req.role = membership.role;
        }
      }
    }
    next();
  }
}
