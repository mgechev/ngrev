import { Injectable, InjectionToken } from "@angular/core";

@Injectable()
export class BasicProvider {}

export const TOKEN = new InjectionToken('token');
