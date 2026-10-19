import { Controller, Get, Module, Param, Query } from '@nestjs/common';
import { CatalogService } from '../../modules/catalog/public.js';
import { CatalogRepository } from '../../modules/catalog/catalog.repository.js';
@Controller()
class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get('restaurants') restaurants(@Query() query: Record<string, unknown>) { return this.catalog.restaurants(query); }
  @Get('restaurants/:id') restaurant(@Param('id') id: string) { return this.catalog.restaurant(id); }
  @Get('dishes') dishes(@Query() query: Record<string, unknown>) { return this.catalog.dishes(query); }
  @Get('dishes/:id') dish(@Param('id') id: string) { return this.catalog.dish(id); }
  @Get('dish-categories') categories(@Query() query: Record<string, unknown>) { return this.catalog.categories(query); }
}
@Module({ controllers: [CatalogController], providers: [CatalogRepository, CatalogService] })
export class CatalogModule {}
