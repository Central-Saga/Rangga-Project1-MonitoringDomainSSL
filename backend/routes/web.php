<?php

use App\Http\Controllers\WebController;
use App\Http\HealthCheck;
use Illuminate\Support\Facades\Route;

Route::get('/health/ready', HealthCheck::class)->name('health.ready');
Route::get('/', [WebController::class, 'welcome'])->name('welcome');
Route::get('/renewal-invoice', [WebController::class, 'renewalInvoicePreview'])->name('renewal-invoice.preview');
