import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryFailedError } from 'typeorm';
import { Customer, Vehicle, RentalBooking } from './entities.js';
import { CustomerDto, VehicleDto, BookingDto } from './dto.js';

async function write<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); }
    catch (error) {
        if (error instanceof QueryFailedError) {
            const code = (error.driverError as { code?: string }).code;
            if (code === '23505') throw new ConflictException('Email or registration number already exists');
            if (code === '23503') throw new ConflictException('Record is referenced by a booking or no longer exists');
        }
        throw error;
    }
}

@Injectable()
export class CustomersService {
    constructor(@InjectRepository(Customer) private readonly repo: Repository<Customer>) { }
    findAll() { return this.repo.find({ order: { id: 'ASC' } }); }
    async findOne(id: number) {
        const item = await this.repo.findOneBy({ id });
        if (!item) throw new NotFoundException('Customer not found');
        return item;
    }
    create(dto: CustomerDto) { return write(() => this.repo.save(this.repo.create(dto))); }
    async update(id: number, dto: CustomerDto) {
        const item = await this.findOne(id);
        return write(() => this.repo.save(this.repo.merge(item, dto)));
    }
    async remove(id: number) {
        const result = await write(() => this.repo.delete(id));
        if (!result.affected) throw new NotFoundException('Customer not found');
        return { message: 'Customer deleted' };
    }
}

@Injectable()
export class VehiclesService {
    constructor(@InjectRepository(Vehicle) private readonly repo: Repository<Vehicle>) { }
    findAll() { return this.repo.find({ order: { id: 'ASC' } }); }
    async findOne(id: number) {
        const item = await this.repo.findOneBy({ id });
        if (!item) throw new NotFoundException('Vehicle not found');
        return item;
    }
    create(dto: VehicleDto) { return write(() => this.repo.save(this.repo.create(dto))); }
    async update(id: number, dto: VehicleDto) {
        const item = await this.findOne(id);
        return write(() => this.repo.save(this.repo.merge(item, dto)));
    }
    async remove(id: number) {
        const result = await write(() => this.repo.delete(id));
        if (!result.affected) throw new NotFoundException('Vehicle not found');
        return { message: 'Vehicle deleted' };
    }
}

@Injectable()
export class BookingsService {
    constructor(@InjectRepository(RentalBooking) private readonly repo: Repository<RentalBooking>,
        private readonly dataSource: DataSource) { }
    findAll() { return this.repo.find({ relations: { customer: true, vehicle: true }, order: { id: 'ASC' } }); }
    async findOne(id: number) {
        const item = await this.repo.findOne({ where: { id }, relations: { customer: true, vehicle: true } });
        if (!item) throw new NotFoundException('Booking not found');
        return item;
    }
    create(dto: BookingDto) { return this.saveBooking(dto); }
    update(id: number, dto: BookingDto) { return this.saveBooking(dto, id); }

    private async saveBooking(dto: BookingDto, id?: number) {
        if (dto.startDate > dto.endDate) throw new BadRequestException('End date must be on or after start date');
        return write(() => this.dataSource.transaction(async manager => {
            const bookings = manager.getRepository(RentalBooking);
            // Lock the existing booking during an update; then serialize writes for the target vehicle.
            const existing = id === undefined ? null : await bookings.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
            if (id !== undefined && !existing) throw new NotFoundException('Booking not found');
            const vehicle = await manager.getRepository(Vehicle).findOne({ where: { id: dto.vehicleId }, lock: { mode: 'pessimistic_write' } });
            if (!vehicle) throw new NotFoundException('Vehicle not found');
            const customer = await manager.getRepository(Customer).findOneBy({ id: dto.customerId });
            if (!customer) throw new NotFoundException('Customer not found');
            const query = bookings.createQueryBuilder('b')
                .where('b.vehicleId = :vehicleId', { vehicleId: dto.vehicleId })
                .andWhere('b.startDate <= :endDate AND b.endDate >= :startDate', { startDate: dto.startDate, endDate: dto.endDate });
            if (id !== undefined) query.andWhere('b.id != :id', { id });
            if (await query.getOne()) throw new ConflictException('Vehicle already booked for an overlapping period');
            const item = existing ? bookings.merge(existing, dto) : bookings.create(dto);
            return bookings.save(item);
        }));
    }
    async remove(id: number) {
        const result = await this.repo.delete(id);
        if (!result.affected) throw new NotFoundException('Booking not found');
        return { message: 'Booking deleted' };
    }
}
