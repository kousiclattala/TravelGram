import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/services/auth.service';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';

import { finalize } from 'rxjs/operators';

import { NgForm } from '@angular/forms';

// *Image compressor
import {
  BrowserImageResizer,
  readAndCompressImage,
} from 'browser-image-resizer';
import { Imageconfig } from 'src/utils/imageConfig';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  picture: string = '../../../assets/img.png';

  uploadPercent: number = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService,

    private db: AngularFireDatabase,
    private storage: AngularFireStorage
  ) {}

  ngOnInit(): void {}

  onSubmit(f: NgForm) {
    const { email, password, name, username, bio, country } = f.form.value;

    //* Do further sanitization here - like password match, email should be email etc.

    this.auth
      .signUp(email, password)
      .then((res) => {
        const { uid } = res.user;

        this.db.object(`/users/${uid}`).set({
          id: uid,
          name: name,
          email: email,
          instaUsername: username,
          picture: this.picture,
          bio: bio,
          country: country,
        });
      })
      .then(() => {
        this.router.navigateByUrl('/');
        this.toastr.success('SignUp Successful');
      })
      .catch((err) => {
        console.log(err.message);
        this.toastr.error('SignUp Not Successful');
      });
  }

  async uploadFile(event) {
    console.log(event);
    const file = event.target.files[0];

    let resizedImage = await readAndCompressImage(file, Imageconfig);

    const filePath = file.name; //change file name to uuid
    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath, resizedImage);

    task.percentageChanges().subscribe((percentage) => {
      this.uploadPercent = percentage; // you can add upload percentage bar here.
    });

    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;
            this.toastr.success('Image Upload success');
          });
        })
      )
      .subscribe();
  }
}
