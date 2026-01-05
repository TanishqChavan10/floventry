import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IssueNote } from './entities/issue-note.entity';
import { IssueNoteItem } from './entities/issue-note-item.entity';
import { StockLot } from '../inventory/entities/stock-lot.entity';
import { Stock } from '../inventory/entities/stock.entity';
import { StockMovement } from '../inventory/entities/stock-movement.entity';
import { IssuesService } from './issues.service';
import { IssuesResolver } from './issues.resolver';
import { SalesModule } from '../sales/sales.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            IssueNote,
            IssueNoteItem,
            StockLot,
            Stock,
            StockMovement,
        ]),
        SalesModule, // Import for SalesService
        AuthModule,
    ],
    providers: [IssuesService, IssuesResolver],
    exports: [IssuesService],
})
export class IssuesModule { }
