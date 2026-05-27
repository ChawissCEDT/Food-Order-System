import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ageLabel',
  standalone: true
})
export class AgeLabelPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'No age';
    }

    return `${value} ${value === 1 ? 'year' : 'years'} old`;
  }
}
