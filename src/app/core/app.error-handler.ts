import { LocationStrategy, PathLocationStrategy } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Inject, NgZone } from "@angular/core";
import { ToastOptions, ToastyService } from "ng2-toasty";
import * as StackTrace from "stacktrace-js";

export class AppErrorHandler extends ErrorHandler {
  constructor(
    @Inject(NgZone) private ngZone: NgZone,
    @Inject(ToastyService) private toastyService: ToastyService,
    @Inject(LocationStrategy) private locationProvider: LocationStrategy
  ) {
    super();
  }

  handleError(error: any): void {
    console.log("Error:", error);

    const url = this.locationProvider instanceof PathLocationStrategy ? this.locationProvider.path() : "";
    const message = this.getError(error);
    this.ngZone.run(() => {
      this.toastyService.error(
        <ToastOptions>{
          title: "Error!",
          msg: `URL:${url} \n ERROR:${message}`,
          theme: "bootstrap",
          showClose: true,
          timeout: 15000
        }
      );
    });

    super.handleError(error);
  }

  getError(error: any): string {
    const date = new Date().toISOString();

    this.getStackTrace(error).then(stackTrace => {
      // TODO: log it on the server --> { message, url, stackTrace }
      console.log("StackTrace", stackTrace);
    }).catch(err => {
      console.log("StackTrace Error", err);
    });

    if (error instanceof HttpErrorResponse) {
      return `HTTP error occurred at ${date}, ${error.message}, ${(<HttpErrorResponse>error).status}, ${error.statusText},
       ${this.gerErrorDetails(error.error)}`;
    }

    if (error instanceof TypeError) {
      return `Type error occurred at ${date}, message - ${error.message}`;
    }

    if (error instanceof Error) {
      return `General error occurred at ${date}, message - ${error.message}`;
    }

    return `Some magical error occurred at ${date}, error - ${error}`;
  }

  gerErrorDetails(error: any): string {
    const errors: string[] = [];
    if (typeof error === "object" && error.constructor === Object) {
      for (const fieldName in error) {
        if (error.hasOwnProperty(fieldName)) {
          const modelStateError = error[fieldName];
          errors.push(`${fieldName}: ${modelStateError}`);
        }
      }
    } else {
      errors.push(error.toString());
    }
    return errors.join(", ");
  }

  getStackTrace(error: any): Promise<string> {
    return StackTrace.fromError(error)
      .then(stackFrames => stackFrames.splice(0, 20).map(stackFrame => stackFrame.toString()).join("\n"));
  }
}
