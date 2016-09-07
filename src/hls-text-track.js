/**
 * @file hls-text-track.js
 */
import {TextTrack, xhr} from 'video.js';
import window from 'global/window';
import PlaylistLoader from './playlist-loader';

/**
 * takes a webvtt file contents and parses it into cues
 *
 * @param {String} srcContent webVTT file contents
 * @param {Track} track track to addcues to
 */
const parseCues = function(srcContent, track) {
  const parser = new window.WebVTT.Parser(window, window.vttjs, window.WebVTT.StringDecoder());
  const errors = [];

  parser.oncue = function(cue) {
    // Double check we don't already have this cue before we add it
    //(WebVTT streams are mandated to include cues in both segments should the cue span
    // a segment boundary)
    const cues = track.cues;
    let i = cues.length;

    // Start from the back so that if it's recently been added we can exit early
    while (i-- > 0) {
      // If the content and timing is the same, it's the same:
      let otherCue = cues[i];
      if (otherCue.startTime === cue.startTime
       && otherCue.endTime === cue.endTime
       && otherCue.text === cue.text) { return; }
    }

    track.addCue(cue);
  };

  parser.onparsingerror = function(error) {
    errors.push(error);
  };

  parser.onflush = function() {
    track.trigger({
      type: 'loadeddata',
      target: track
    });
  };

  parser.parse(srcContent);
  if (errors.length > 0 && window.console) {
    if (window.console.groupCollapsed) {
      window.console.groupCollapsed(`Text Track parsing errors for ${track.src}`);
    }
    errors.forEach((error) => console.error(error));
    if (window.console.groupEnd) {
      window.console.groupEnd();
    }
  }

  parser.flush();
};

/**
 * load a track from a  specifed url
 *
 * @param {String} src url to load track from
 * @param {Track} track track to addcues to
 */
const loadTrack = function(src, track) {
  const opts = {
    uri: src,
  }

  xhr(opts, Fn.bind(this, function(err, response, responseBody) {
    if (err && window.console) {
      return console.error(err, response);
    }

    parseCues(responseBody, track);
  }));
};

/**
 * HlsTextTrack extends video.js text tracks but adds HLS
 * specific data storage such as playlist loaders, mediaGroups
 * and default/autoselect
 *
 * @param {Object} options options to create HlsTextTrack with
 * @class HlsTextTrack
 * @extends TextTrack
 */
export default class HlsTextTrack extends TextTrack {
  constructor(options) {
    super({
      kind: options.default ? 'main' : 'alternative',
      enabled: options.default || false,
      language: options.language,
      label: options.label,
      tech: options.tech,
    });

    this.hls = options.hls;
    this.autoselect = options.autoselect || false;
    this.default = options.default || false;
    this.withCredentials = options.withCredentials || false;
    this.mediaGroups_ = [];
    this.addLoader(options.mediaGroup, options.resolvedUri);
  }

  /**
   * get a PlaylistLoader from this track given a mediaGroup name
   *
   * @param {String} mediaGroup the mediaGroup to get the loader for
   * @return {PlaylistLoader|Null} the PlaylistLoader or null
   */
  getLoader(mediaGroup) {
    for (let i = 0; i < this.mediaGroups_.length; i++) {
      let mgl = this.mediaGroups_[i];

      if (mgl.mediaGroup === mediaGroup) {
        return mgl.loader;
      }
    }
  }

  /**
   * add a PlaylistLoader given a mediaGroup, and a uri. for a combined track
   * we store null for the playlistloader
   *
   * @param {String} mediaGroup the mediaGroup to get the loader for
   * @param {String} uri the uri to get the audio track/mediaGroup from
   */
  addLoader(mediaGroup, uri = null) {
    let loader = null;

    if (uri) {
      // TODO: this should probably happen upstream in Master Playlist
      // Controller when we can switch PlaylistLoader sources
      // then we can just store the uri here instead
      loader = new PlaylistLoader(uri, this.hls, this.withCredentials);
    }
    this.mediaGroups_.push({mediaGroup, loader});
  }

  /**
   * remove a playlist loader from a track given the mediaGroup
   *
   * @param {String} mediaGroup the mediaGroup to remove
   */
  removeLoader(mediaGroup) {
    for (let i = 0; i < this.mediaGroups_.length; i++) {
      let mgl = this.mediaGroups_[i];

      if (mgl.mediaGroup === mediaGroup) {
        if (mgl.loader) {
          mgl.loader.dispose();
        }
        this.mediaGroups_.splice(i, 1);
        return;
      }
    }
  }

  /**
   * Dispose of this text track and the playlist loader that it holds inside
   */
  dispose() {
    let i = this.mediaGroups_.length;

    while (i--) {
      this.removeLoader(this.mediaGroups_[i].mediaGroup);
    }
  }
}
