import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CustomersService, VehiclesService, BookingsService } from './services.js';
import { CustomerDto, VehicleDto, BookingDto } from './dto.js';
import { Roles, RolesGuard, CurrentUser } from './auth.js';

@Controller('customers')
@UseGuards(RolesGuard)
export class CustomersController {
    constructor(private readonly service: CustomersService) { }
    @Get() findAll() { return this.service.findAll(); }
    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() @Roles('admin') create(@Body() dto: CustomerDto) { return this.service.create(dto); }
    @Put(':id') @Roles('admin') update(@Param('id', ParseIntPipe) id: number, @Body() dto: CustomerDto) { return this.service.update(id, dto); }
    @Delete(':id') @Roles('admin') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Controller('vehicles')
@UseGuards(RolesGuard)
export class VehiclesController {
    constructor(private readonly service: VehiclesService) { }
    @Get() findAll() { return this.service.findAll(); }
    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() @Roles('admin') create(@Body() dto: VehicleDto) { return this.service.create(dto); }
    @Put(':id') @Roles('admin') update(@Param('id', ParseIntPipe) id: number, @Body() dto: VehicleDto) { return this.service.update(id, dto); }
    @Delete(':id') @Roles('admin') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingsController {
    constructor(private readonly service: BookingsService) { }
    @Get() findAll() { return this.service.findAll(); }
    @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
    @Post() @Roles('admin', 'staff') create(@Body() dto: BookingDto) { return this.service.create(dto); }
    @Put(':id') @Roles('admin') update(@Param('id', ParseIntPipe) id: number, @Body() dto: BookingDto) { return this.service.update(id, dto); }
    @Delete(':id') @Roles('admin') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@Controller('auth')
@UseGuards(RolesGuard)
export class AuthController {
    @Get('me') me(@CurrentUser() user: unknown) { return user; }
}
