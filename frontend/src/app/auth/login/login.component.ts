import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GoogleApiService } from 'src/app/services/google-api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss', '../../app.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private googleApiService: GoogleApiService,
  ) { }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['code'] && !this.authService.checkLog()) {
      console.log(this.route.snapshot.queryParams['code']);
      this.authService.login42(this.route.snapshot.queryParams['code']);
    }
    else if (this.authService.checkLog()) {
      this.router.navigate(['']);
    }
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  onSubmit(): void {
    const { username, password } = this.loginForm.value;
    if (this.loginForm.valid) {
      this.authService.login(username, password);
    }
  }

  login42(): void {
    window.location.href = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-7feb0047cfee4fa23be912df2417939b20af1e2b7a2869b4fd1048b77d85d2bb&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Fauth%2Flogin&response_type=code';
  }

  loginGoogle(): void {
    this.googleApiService.loginWithGoogle();
  }
}