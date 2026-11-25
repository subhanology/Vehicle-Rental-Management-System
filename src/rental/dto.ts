import { IsString, IsNotEmpty, IsEmail, MaxLength, IsInt, Min, Max, IsDateString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CustomerDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail() @MaxLength(150) email!: string;
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString() @IsNotEmpty() @MaxLength(30) phone!: string;
}

export class VehicleDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString() @IsNotEmpty() @MaxLength(100) name!: string;
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value)
    @IsString() @IsNotEmpty() @MaxLength(40) registrationNumber!: string;
    @IsInt() @Min(1) @Max(100000000) dailyRate!: number;
}

export class BookingDto {
    @IsInt() @Min(1) customerId!: number;
    @IsInt() @Min(1) vehicleId!: number;
    @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) startDate!: string;
    @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) endDate!: string;
}
