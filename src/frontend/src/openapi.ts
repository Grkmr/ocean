import * as DefaultService from "@/src/api/generated/index";

DefaultService.OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL as string;

export const Api = DefaultService;
