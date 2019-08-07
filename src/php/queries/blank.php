<?php
  /*
    This script represents the main template that is used for all PHP
    queries on the server. Class NameOfTheQuery should be named like
    the file name (except the first upper case letter) and should implement
    public non-static function `query` that performs any operation on the
    database.
  */

  class NameOfTheQuery extends Query{
    public function query($pdo, $args){
      /*
        $pdo - the PDO database object
        $args - object containing arguments

        Perform any operations here, if all operations were successfull
        then call $this->succ(data), where `data` is an optional argument.
        If the query was unsuccessfull, then call `this->err(msg)` and add
        the `msg` to the src/www/projects/main/strings/locales/.../main.json
      */
    }
  }

  new NameOfTheQuery();
?>