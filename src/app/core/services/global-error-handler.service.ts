import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, inject, Injectable, NgZone } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private zone = inject(NgZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public handleError(error: any): void {
    const errorValue = error.rejection ? error.rejection : error;

    let message = '';
    let stackTrace = '';

    if (errorValue instanceof HttpErrorResponse) {
      message = `Server Error: ${errorValue.status} - ${errorValue.message}`;
    } else if (errorValue instanceof Error) {
      message = `Client Error: ${errorValue.message}`;
      stackTrace = errorValue.stack || '';
    } else {
      message = `Unexpected Error: ${errorValue}`;
    }

    console.group('🔥 Global Error Handler Caught:');
    console.error('Message:', message);
    console.error('Stack:', stackTrace);
    console.error('Raw Error:', error);
    console.groupEnd();
  }
}
