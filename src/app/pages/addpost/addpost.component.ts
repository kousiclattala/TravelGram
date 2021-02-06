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

import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-addpost',
  templateUrl: './addpost.component.html',
  styleUrls: ['./addpost.component.css'],
})
export class AddpostComponent implements OnInit {
  locationName: string;
  description: string;

  picture: string = null;
  uploadPercent: number = null;

  user = null;

  constructor(
    private auth: AuthService,
    private toastr: ToastrService,
    private db: AngularFireDatabase,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    this.auth.getUser().subscribe((user) => {
      this.db
        .object(`/users/${user.uid}`)
        .valueChanges()
        .subscribe((user) => {
          this.user = user;
        });
    });
  }

  ngOnInit(): void {}

  onSubmit() {
    const uid = uuidv4();

    this.db
      .object(`/posts/${uid}`)
      .set({
        id: uid,
        locationName: this.locationName,
        description: this.description,
        picture: this.picture,
        by: this.user.name,
        instaId: this.user.instaUsername,
        date: Date.now(),
      })
      .then(() => {
        this.toastr.success('Post Added Successfully');
        this.router.navigateByUrl('/');
      })
      .catch((err) => {
        this.toastr.error('Oopssss');
      });
  }

  async uploadFile(event) {
    const file = event.target.files[0]; //* gives local location of the file

    const resizedImage = await readAndCompressImage(file, Imageconfig);

    const filePath = file.name;

    const fileRef = this.storage.ref(filePath);

    const task = this.storage.upload(filePath, resizedImage);

    task.percentageChanges().subscribe((percentage) => {
      this.uploadPercent = percentage;
    });

    task
      .snapshotChanges()
      .pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url) => {
            this.picture = url;

            this.toastr.success('Picture Upload Sucess');
          });
        })
      )
      .subscribe();
  }
}
