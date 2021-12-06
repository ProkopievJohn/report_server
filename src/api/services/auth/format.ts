import { ICompany } from 'src/models/company'
import { IUser } from 'src/models/user'
import { ExtractOmitType, extractOmit } from 'src/utils/helpers'

const meSkipKeys: string[] = ['password', 'companyId', 'emailVerified']
type TUserSkipKeys = typeof meSkipKeys[number]

export type MeResponseType = {
	user: ExtractOmitType<IUser, TUserSkipKeys>
	company: ICompany
	accessToken?: string
}

export const meFormatService = (me: IUser, company: ICompany, accessToken?: string): MeResponseType => ({
	user: extractOmit(me, meSkipKeys),
	company,
	accessToken,
})
