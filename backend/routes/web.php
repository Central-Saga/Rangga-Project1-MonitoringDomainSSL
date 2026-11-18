<?php

use App\Http\Controllers\WebController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WebController::class, 'welcome'])->name('welcome');
Route::get('/renewal-invoice', [WebController::class, 'renewalInvoicePreview'])->name('renewal-invoice.preview');
