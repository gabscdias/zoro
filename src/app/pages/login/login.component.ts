import { LoginService } from './../../services/login.service';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoginLayoutComponent } from './../../components/login-layout/login-layout.component';
import { Component } from '@angular/core';
import { InputComponent } from '../../components/input/input.component';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { cpfCnpjValidator } from '../../utils/cpfCnpjValidator';
import { CommonModule } from '@angular/common';
import { LoginRequest } from '../../types/login-request.type';
import { EstablishmentUserService } from '../../services/establishment-user.service';
import { LoadingComponent } from '../../components/loading/loading.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    LoginLayoutComponent,
    ReactiveFormsModule,
    InputComponent,
    CommonModule,
    LoadingComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private loginService: LoginService,
    private toastrService: ToastrService,
    private establishmentUserService: EstablishmentUserService
  ) {
    this.loginForm = new FormGroup({
      //Criar validador para documento(CPF ou CNPJ)
      document: new FormControl('', [Validators.required, cpfCnpjValidator]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
    });
  }

  submit() {
    this.isLoading = true;
    if (this.loginForm.valid) {
      const loginRequest: LoginRequest = {
        userLogin: this.loginForm.value.document,
        password: this.loginForm.value.password,
        twoFactorCode: '',
        twoFactorRecoveryCode: '',
        useCookies: true,
        useSessionCookies: true,
        serviceProvider: null,
      };
      this.loginService.login(loginRequest).subscribe({
        next: () => {
          let estabelecimentos;
          this.establishmentUserService.getEstablishmentsUser().subscribe(
            (data) => {
              estabelecimentos = data;
              if (estabelecimentos != null) {
                if (estabelecimentos.length > 1) {
                  this.router.navigate(['/estabelecimentos']);
                } else {
                  this.router.navigate(['/index']);
                }
              }
            },
            (error) => {
              this.loginService.logout();
              this.isLoading = false;
              this.toastrService.error('Erro ao carregar estabelecimentos do usuário.');
            }
          );
        },
        error: () => {
          this.isLoading = false;
          this.toastrService.error('Erro ao realizar login!');
        },
      });
    } else {
      this.invalidFields(this.loginForm);
    }
  }

  navigate() {
    this.router.navigate(['/signup']);
  }

  invalidFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);

      if (control && control.invalid) {
        const errors = control.errors;

        console.log(`Campo inválido: ${field}`);

        if (errors) {
          if (errors['invalidDocument']) {
            console.log(`${field} contém um CPF inválido.`);
            this.toastrService.error('CPF/CNPJ inválido.');
          }

          // Verifica outros erros como required, minlength
          if (errors['required']) {
            console.log(`${field} é obrigatório.`);
            const fieldName = field === 'password' ? 'Senha' : 'Documento';
            this.toastrService.error(`${fieldName} é obrigatório.`);
          }
          if (errors['minlength']) {
            console.log(
              `${field} deve ter no mínimo ${errors['minlength'].requiredLength} caracteres.`
            );
            this.toastrService.error(
              `A senha deve ter no mínimo ${errors['minlength'].requiredLength} caracteres.`
            );
          }
        }
      }
    });
  }
}
