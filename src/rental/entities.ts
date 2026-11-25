import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('customers')
export class Customer {
    @PrimaryGeneratedColumn() id!: number;
    @Column({ length: 100 }) name!: string;
    @Column({ length: 150, unique: true }) email!: string;
    @Column({ length: 30 }) phone!: string;
}

@Entity('vehicles')
export class Vehicle {
    @PrimaryGeneratedColumn() id!: number;
    @Column({ length: 100 }) name!: string;
    @Column({ length: 40, unique: true }) registrationNumber!: string;
    @Column({ type: 'integer' }) dailyRate!: number;
}

@Entity('rental_bookings')
@Index(['vehicleId', 'startDate', 'endDate'])
export class RentalBooking {
    @PrimaryGeneratedColumn() id!: number;
    @Column({ type: 'integer' }) customerId!: number;
    @ManyToOne(() => Customer, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'customerId' }) customer!: Customer;
    @Column({ type: 'integer' }) vehicleId!: number;
    @ManyToOne(() => Vehicle, { nullable: false, onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'vehicleId' }) vehicle!: Vehicle;
    @Column({ type: 'date' }) startDate!: string;
    @Column({ type: 'date' }) endDate!: string;
}
