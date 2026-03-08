import { runBatchDownloader } from '../core/app';
import { isSupportedPage } from '../config/sites';

if (isSupportedPage()) {
  runBatchDownloader();
}
