import { ArgumentsHost, Catch, RpcExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { Observable, throwError } from "rxjs";

@Catch()
export class AllRpcExceptionsFilter implements RpcExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost): Observable<unknown> {
    if (exception instanceof RpcException) {
      return throwError(() => exception);
    }

    return throwError(() => new RpcException("Internal server error"));
  }
}
