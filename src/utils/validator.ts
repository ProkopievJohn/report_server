import { registerDecorator, validate, validateSync, ValidationArguments, ValidationError, ValidationOptions } from 'class-validator'
import { plainToClass, ClassConstructor } from 'class-transformer'
import { ObjectId } from 'mongodb'

type FieldErrors = {
	[name: string]: string,
}

export type ValidateResponse = {
	message: string,
	fields: FieldErrors,
}

export function CustomIsMongoId(validationOptions?: ValidationOptions) {
	return (object: unknown, propertyName: string): void => {
		registerDecorator({
			name: 'customIsMongoId',
			target: object.constructor,
			propertyName,
			options: {
				message: `${propertyName} must be a mongodb id`,
				...validationOptions,
			},
			validator: {
				validate(value: ObjectId | string) {
					return Array.isArray(value) ? value.every((v: unknown) => ObjectId.isValid(v as ObjectId | string)) : ObjectId.isValid(value)
				},
			},
		})
	}
}

export function IsNonPrimitiveArray<C>(classToConvert: ClassConstructor<C>, validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string): void => {
    registerDecorator({
      name: 'IsNonPrimitiveArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(value: C[]) {
					if (Array.isArray(value)) {
            for (let i = 0; i < (<Array<C>>value).length; i++) {
              if (validateSync(plainToClass(classToConvert, value[i]) as Record<string, unknown>).length) {
                return false;
              }
            }
            return true;
          }
					return false
        },
				defaultMessage(args: ValidationArguments) {
          if (Array.isArray(args.value)) {
            for (let i = 0; i < (<Array<C>>args.value).length; i++) {
							return validateSync(plainToClass(classToConvert, args.value[i]) as Record<string, unknown>).reduce((acc: string, err: ValidationError) => acc + (acc ? ', ' : '') + [...Object.values(err.constraints)].join(', '), '')
            }
          } else
            return `${propertyName} must be an array of objects`
        },
      },
    });
  };
}

export async function validateAndConvert<C, B>(
	classToConvert: ClassConstructor<C>,
	body: B,
): Promise<boolean | ValidateResponse> {
	try {
		const data: C = plainToClass(classToConvert, body)
		const errors: ValidationError[] = await validate(data as Record<string, unknown>)
	
		if (errors.length) {
			return errors.reduce((acc: ValidateResponse, err: ValidationError) => {
				return {
					message: acc.message + (acc.message ? ', ' : '') + [...Object.values(err.constraints)].join(', '),
					fields: {
						...acc.fields,
						[err.property]: [...Object.values(err.constraints)].join(', ') },
				}
			}, { message: '', fields: {} })
		}
		return false
	} catch (err) {
		return {
			message: 'Wrong fields',
			fields: {}
		}
	}
}