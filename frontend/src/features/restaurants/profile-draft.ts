import type {Settings} from './api/settings.api'
export type ProfileDraft={name:string;address:string;contact_phone:string;latitude:string;longitude:string;description:string;cover_image_reference:string|null;avatar_image_reference:string|null}
export const profileDraft=(d:Settings):ProfileDraft=>({name:d.name,address:d.address,contact_phone:d.contact_phone,latitude:d.latitude??'',longitude:d.longitude??'',description:d.description??'',cover_image_reference:d.cover_image_reference??null,avatar_image_reference:d.avatar_image_reference??null})
