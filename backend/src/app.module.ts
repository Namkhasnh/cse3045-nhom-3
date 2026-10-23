import {RecommendationsModule} from './http/recommendations/recommendations.module.js';
import {NotificationsModule} from './http/notifications/notifications.module.js';
import {NotificationsDomainModule} from './modules/notifications/notifications.module.js';
import {AdministrationModule} from './http/administration/administration.module.js';
import {OrdersModule} from './http/orders/orders.module.js';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './common/transactions/transaction.module.js';
import { CatalogModule } from './http/catalog/catalog.module.js';
import { OnboardingModule } from './http/onboarding/onboarding.module.js';
import {CommissionPolicyModule} from './http/commissions/commission.module.js';
import {DishesModule} from './http/dishes/dishes.module.js';
import {DeliveryModule} from './http/delivery/delivery.module.js';
import {RestaurantSettingsModule} from './http/restaurant-settings/settings.module.js';
import { AuthModule } from './http/auth/auth.module.js';

@Module({ imports: [RecommendationsModule,NotificationsDomainModule,NotificationsModule,AdministrationModule,OrdersModule,ConfigModule.forRoot({ isGlobal: true }), PrismaModule, TransactionModule, AuthModule, CatalogModule, OnboardingModule, RestaurantSettingsModule, DeliveryModule, DishesModule, CommissionPolicyModule] })
export class AppModule {}
