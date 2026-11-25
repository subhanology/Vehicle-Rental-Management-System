import { Module } from '@nestjs/common';
import type { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, Vehicle, RentalBooking } from './entities.js';
import { CustomersController, VehiclesController, BookingsController, AuthController } from './controllers.js';
import { CustomersService, VehiclesService, BookingsService } from './services.js';
import { BasicAuthMiddleware, RolesGuard } from './auth.js';

@Module({
    imports: [TypeOrmModule.forFeature([Customer, Vehicle, RentalBooking])],
    controllers: [CustomersController, VehiclesController, BookingsController, AuthController],
    providers: [CustomersService, VehiclesService, BookingsService, RolesGuard],
})
export class RentalModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(BasicAuthMiddleware).forRoutes(CustomersController, VehiclesController, BookingsController, AuthController);
    }
}
