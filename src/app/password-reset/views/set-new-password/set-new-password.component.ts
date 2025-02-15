import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { pipe } from 'fp-ts/lib/function';
import { fromNullable, match } from 'fp-ts/lib/Option';
import { ApiRequest } from 'src/app/sp-common/api/ApiRequest';
import { SetNewPasswordRequest } from 'src/app/sp-common/request/set-new-password.request';
import { SetNewPasswordResponse } from 'src/app/sp-common/response/set-new-password.response';
import { PasswordResetService } from '../../service/password-reset.service';

@Component({
  selector: 'app-set-new-password',
  templateUrl: './set-new-password.component.html',
  styleUrls: ['./set-new-password.component.scss']
})
export class SetNewPasswordComponent implements OnInit {

  newPasswordForm: FormGroup;
  isActionInProgress = false;
  isLinkValid = true;
  resetToken = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    this.newPasswordForm = formBuilder.group({
      password: formBuilder.control('', [Validators.required]),
      passwordConfirmation: formBuilder.control('', [Validators.required, this.checkPasswordMatching])
    });
  }

  ngOnInit(): void {
    this.validateResetToken();
  }

  checkPasswordMatching: ValidatorFn = (confirmation: AbstractControl): ValidationErrors | null => {
    const password = this.newPasswordForm?.get('password')?.value;
    return password === confirmation.value ? null : { invalidPasswordConfirmation: true }
  }

  onResetPassword() {
    const formValues = this.newPasswordForm.value;
    const resetRequest = new SetNewPasswordRequest(this.resetToken, formValues.password);
    const apiRequest = ApiRequest.of(resetRequest);

    this.isActionInProgress = true;
    // TODO: add this to mirage
    this.passwordResetService.sendSetNewPasswordRequest(apiRequest).subscribe(response => {
      this.isActionInProgress = false;
      if (response.error || !response.payload.token) {
        this.handleResetFailure();
      } else {
        this.handleResetSuccess(response.payload);
      }
    })
  }

  handleResetFailure() {
    this.router.navigate(['resetFailure']);
  }

  handleResetSuccess(response: SetNewPasswordResponse) {
    this.router.navigate(['passwordReset'])
  }

  validateResetToken() {
    pipe(
      this.route.snapshot.queryParamMap.get('token') || null,
      fromNullable,
      match(
        this.handleInvalidToken.bind(this),
        this.handleValidToken.bind(this)
      )
    )
  }

  handleValidToken(token: string) {
    this.resetToken = token;
  }

  handleInvalidToken() {
    this.isLinkValid = false;
  }

}
