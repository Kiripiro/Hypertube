import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';
import { HomeComponent } from './home/home.component';
import { AuthModule } from './auth/auth.module';
import { ProfileComponent } from './profile/profile.component';
import { SettingsComponent } from './settings/settings.component';
import { WaitComponent } from './wait/wait.component';
import { ResetComponent } from './reset/reset.component';
import { DetailsComponent } from './details/details.component';
import { SearchComponent } from './search/search.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile/:username', component: ProfileComponent },
  { path: 'stream/:ytsId/:imdbId/:title/:freeId', component: DetailsComponent },
  { path: 'auth', loadChildren: () => AuthModule },
  { path: 'settings', component: SettingsComponent },
  { path: 'search', component: SearchComponent },
  { path: 'verification/:type/:token', component: WaitComponent },
  { path: 'resetpassword', component: ResetComponent },
  { path: 'notFound', component: NotFoundComponent },
  { path: '**', redirectTo: '/notFound', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
