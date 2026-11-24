FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY . .
RUN composer dump-autoload --optimize --no-dev --no-scripts --classmap-authoritative

FROM php:8.3-fpm-alpine

RUN apk add --no-cache postgresql-libs libzip curl git \
 && docker-php-ext-install pdo pdo_pgsql zip opcache \
 && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev \
 && pecl install redis \
 && docker-php-ext-enable redis \
 && apk del .build-deps

COPY --from=vendor /app /var/www/html

RUN sed -i 's/^listen = 9000/listen = 8080/' /usr/local/etc/php-fpm.d/www.conf \
 && mkdir -p /var/www/html/storage/framework/views /var/www/html/storage/framework/cache /var/www/html/bootstrap/cache \
 && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Audit 13.6: config/route/view di-cache saat build, bukan saat runtime.
RUN php artisan config:cache \
 && php artisan route:cache \
 && php artisan view:cache

WORKDIR /var/www/html
EXPOSE 8080
USER www-data

CMD ["php-fpm", "-F"]
