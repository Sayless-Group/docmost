import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { StorageModule } from '../storage/storage.module';
import { DocxExporter } from './docx-exporter';

@Module({
  imports: [StorageModule],
  providers: [ExportService, DocxExporter],
  controllers: [ExportController],
})
export class ExportModule {}
